'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface PrimaryKeyword {
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  intent?: string;
  country?: string;
  tag: string;
  generated_at?: { $date: string } | string;
  finalized_at?: { $date: string } | string;
}

interface SecondaryKeywordItem {
  keyword: string;
  search_volume?: number;
  difficulty?: number;
  intent?: string;
  selected?: string;
  tag?: string;
}

interface SecondaryKeywords {
  keywords: SecondaryKeywordItem[];
  tag: string;
  generated_at?: { $date: string } | string;
  finalized_at?: { $date: string } | string;
  primary_keyword?: string;
  intent?: string;
  country?: string;
}

interface SubcategoryItem {
  name: string;
  selected: boolean;
}

interface CategoryItem {
  category: string;
  subcategories: SubcategoryItem[];
  selected: boolean;
}

interface CategoryEntry {
  categories: CategoryItem[];
  generated_at?: { $date: string } | string;
  finalized_at?: { $date: string } | string;
  last_updated_at?: { $date: string } | string;
  primary_keyword?: string;
  secondary_keywords?: string[];
  intent?: string;
  country?: string;
  tag: string;
}

interface TitleItem {
  title: string;
  selected: boolean;
}

interface TitleEntry {
  titles: (string | TitleItem)[];
  tag: string;
  generated_at?: { $date: string } | string;
  finalized_at?: { $date: string } | string;
  selected_title?: string;
  primary_keyword?: string;
  intent?: string;
  country?: string;
  category?: string;
  subcategory?: string;
}

interface OutlineSectionItem {
  heading: string;
  subsections?: string[];
}

interface OutlineConclusion {
  heading: string;
  subsections?: string[];
}

interface OutlineFAQs {
  heading: string;
  questions: string[];
}

interface OutlineStructure {
  sections: OutlineSectionItem[];
  conclusion?: OutlineConclusion;
  faqs?: OutlineFAQs;
}

interface OutlineEntry {
  outline: {
    outline: OutlineStructure;
  };
  tag: string;
  generated_at?: { $date: string } | string;
  updated_at?: { $date: string } | string;
  finalized_at?: { $date: string } | string;
  selected_title?: string;
  word_count?: string;
  primary_keyword?: string;
  intent?: string;
  category?: string;
  subcategory?: string;
  country?: string;
  secondary_keywords?: string[];
  sources_collected?: boolean;
  blog_title?: string;
  usage_stats?: unknown;
}

interface OutlineItem {
  section: string;
  subsections?: string[];
}

interface Outline {
  outline: OutlineItem[];
  tag?: string;
}

interface Source {
  url?: string;
  title?: string;
  relevance_score?: number;
  content?: string;
  subsections_data?: Array<{
    title: string;
    heading_index?: number;
    subsection_index?: number;
    heading_title?: string;
    is_direct_heading?: boolean;
    sources?: Array<{
      url: string;
      title: string;
      success: boolean;
    }>;
    informations?: {
      [key: string]: {
        link_and_source_name: string;
        information: {
          [key: string]: string;
        };
      };
    };
  }>;
}

interface FeaturedImage {
  url?: string;
  filename?: string;
  status?: string;
}

interface BlogData {
  _id: string;
  title: string | string[];
  status: string;
  created_at: string;
  updated_at: string;
  primary_keyword?: PrimaryKeyword[];
  secondary_keywords?: SecondaryKeywords[];
  category?: string;
  subcategory?: string;
  categories?: CategoryEntry[];
  titles?: TitleEntry[];
  outline?: Outline[];
  outlines?: OutlineEntry[];
  sources?: Source[];
  content?: string | Array<{ html: string }>;
  rayo_featured_image?: FeaturedImage;
}

interface StepDetailsProps {
  selectedStep: string;
  blog: BlogData;
}

// Helper functions outside component
const getCountryFlag = (countryCode: string) => {
  if (!countryCode) return '';
  const code = countryCode.toUpperCase();
  return code
    .split('')
    .map(char => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
};

const parseDate = (dateValue: { $date: string } | string | undefined) => {
  if (!dateValue) return null;
  try {
    let date: Date | null = null;

    if (typeof dateValue === 'object' && '$date' in dateValue) {
      date = new Date(dateValue.$date);
    } else if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    }

    // Validate the date
    if (date && !isNaN(date.getTime())) {
      return date;
    }
    return null;
  } catch {
    return null;
  }
};

export default function StepDetails({ selectedStep, blog }: StepDetailsProps) {
  const router = useRouter();
  const params = useParams();
  const [openCategoryIndices, setOpenCategoryIndices] = useState<number[]>([]);
  const [openOutlineIndices, setOpenOutlineIndices] = useState<number[]>([]);

  const toggleCategoryAccordion = (index: number) => {
    setOpenCategoryIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const toggleOutlineAccordion = (index: number) => {
    setOpenOutlineIndices(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Empty state component
  const EmptyState = ({ stepName }: { stepName: string }) => (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-12">
      <div className="text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <h3 className="mt-4 text-sm font-medium text-gray-900 dark:text-white">No data available</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          The {stepName.replace(/_/g, ' ')} step hasn&apos;t generated data yet or the data is empty.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Primary Keyword */}
      {selectedStep === 'primary_keyword' && (
        <>
          {blog?.primary_keyword && blog.primary_keyword.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Primary Keyword
            <span className="ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
              {blog.primary_keyword.length} {blog.primary_keyword.length === 1 ? 'entry' : 'entries'}
            </span>
          </h3>
          <div className="space-y-4">
            {blog.primary_keyword.map((kw, idx) => (
              <div key={idx} className="border-l-4 border-purple-300 dark:border-purple-900 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    kw.tag === 'final'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : kw.tag === 'updated'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {kw.tag}
                  </span>
                  {(kw.generated_at || kw.finalized_at) && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {parseDate(kw.finalized_at || kw.generated_at)?.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                  {kw.keyword}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {kw.search_volume && (
                    <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                      <span className="text-gray-500 dark:text-gray-400">Search Volume:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {kw.search_volume.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {kw.difficulty && (
                    <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                      <span className="text-gray-500 dark:text-gray-400">Difficulty:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {kw.difficulty}
                      </span>
                    </div>
                  )}
                  {kw.intent && (
                    <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                      <span className="text-gray-500 dark:text-gray-400">Intent:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                        {kw.intent}
                      </span>
                    </div>
                  )}
                  {kw.country && (
                    <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                      <span className="text-gray-500 dark:text-gray-400">Country:</span>
                      <span className="ml-2 text-lg">
                        {getCountryFlag(kw.country)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
          ) : (
            <EmptyState stepName="primary_keyword" />
          )}
        </>
      )}

      {/* Secondary Keywords */}
      {selectedStep === 'secondary_keywords' && (
        <>
          {blog?.secondary_keywords && blog.secondary_keywords.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Secondary Keywords
            <span className="ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
              {blog.secondary_keywords.length} {blog.secondary_keywords.length === 1 ? 'entry' : 'entries'}
            </span>
          </h3>
          <div className="space-y-4">
            {blog.secondary_keywords.map((entry, idx) => (
              <div key={idx} className="border-l-4 border-indigo-300 dark:border-indigo-900 pl-4 py-2">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    entry.tag === 'final'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : entry.tag === 'updated'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {entry.tag}
                  </span>
                  {(entry.generated_at || entry.finalized_at) && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {parseDate(entry.finalized_at || entry.generated_at)?.toLocaleString()}
                    </span>
                  )}
                  {entry.primary_keyword && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Primary: {entry.primary_keyword}
                    </span>
                  )}
                  {entry.intent && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      Intent: {entry.intent}
                    </span>
                  )}
                  {entry.country && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      Country: <span className="text-sm">{getCountryFlag(entry.country)}</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {entry.keywords.map((kw, kwIdx) => (
                    <div
                      key={kwIdx}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        kw.selected === 'true'
                          ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-900'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                        <span>{kw.keyword}</span>
                        {kw.selected === 'true' && (
                          <svg className="inline-block w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {kw.tag && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            {kw.tag}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {kw.search_volume && <span>Vol: {kw.search_volume.toLocaleString()}</span>}
                        {kw.difficulty && <span>Diff: {kw.difficulty}</span>}
                        {kw.intent && <span className="capitalize">{kw.intent}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
          ) : (
            <EmptyState stepName="secondary_keywords" />
          )}
        </>
      )}

      {/* Category */}
      {selectedStep === 'category' && (
        <>
          {blog?.categories && blog.categories.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Category
            <span className="ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
              {blog.categories.length} {blog.categories.length === 1 ? 'entry' : 'entries'}
            </span>
          </h3>
          <div className="space-y-3">
            {blog.categories.map((entry, idx) => {
              const isOpen = openCategoryIndices.includes(idx);
              return (
                <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  {/* Accordion Header - Clickable */}
                  <button
                    onClick={() => toggleCategoryAccordion(idx)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        entry.tag === 'final'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : entry.tag === 'updated'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {entry.tag}
                      </span>
                      {(entry.generated_at || entry.finalized_at || entry.last_updated_at) && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {parseDate(entry.finalized_at || entry.last_updated_at || entry.generated_at)?.toLocaleString()}
                        </span>
                      )}
                      {entry.primary_keyword && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.primary_keyword}
                        </span>
                      )}
                    </div>
                    {/* Chevron icon */}
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Accordion Content - Collapsible */}
                  {isOpen && (
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                      {/* Additional metadata */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                        {entry.intent && (
                          <span className="capitalize">Intent: {entry.intent}</span>
                        )}
                        {entry.country && (
                          <span className="flex items-center gap-1">
                            Country: <span className="text-sm">{getCountryFlag(entry.country)}</span>
                          </span>
                        )}
                      </div>

                      {/* Secondary keywords if present */}
                      {entry.secondary_keywords && entry.secondary_keywords.length > 0 && (
                        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Secondary Keywords:</span> {entry.secondary_keywords.join(', ')}
                        </div>
                      )}

                      {/* Categories and subcategories */}
                      <div className="space-y-3">
                        {entry.categories.map((cat, catIdx) => (
                          <div key={catIdx} className={`p-3 rounded-lg border-2 ${
                            cat.selected
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {cat.category}
                              </span>
                              {cat.selected && (
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {cat.subcategories.map((subcat, subIdx) => (
                                <span
                                  key={subIdx}
                                  className={`px-2 py-1 rounded text-xs ${
                                    subcat.selected
                                      ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 font-medium'
                                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                  }`}
                                >
                                  {subcat.name}
                                  {subcat.selected && ' ✓'}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
          ) : (
            <EmptyState stepName="category" />
          )}
        </>
      )}

      {/* Title */}
      {selectedStep === 'title' && (
        <>
          {blog?.titles && blog.titles.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Title
            <span className="ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
              {blog.titles.length} {blog.titles.length === 1 ? 'entry' : 'entries'}
            </span>
          </h3>
          <div className="space-y-4">
            {blog.titles.map((entry, idx) => (
              <div key={idx} className="border-l-4 border-green-300 dark:border-green-900 pl-4 py-2">
                {/* Entry metadata */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    entry.tag === 'final'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : entry.tag === 'updated'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {entry.tag}
                  </span>
                  {(entry.generated_at || entry.finalized_at) && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {parseDate(entry.finalized_at || entry.generated_at)?.toLocaleString()}
                    </span>
                  )}
                  {entry.primary_keyword && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Primary: {entry.primary_keyword}
                    </span>
                  )}
                  {entry.intent && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      Intent: {entry.intent}
                    </span>
                  )}
                  {entry.country && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      Country: <span className="text-sm">{getCountryFlag(entry.country)}</span>
                    </span>
                  )}
                  {entry.category && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Category: {entry.category}
                    </span>
                  )}
                  {entry.subcategory && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Subcategory: {entry.subcategory}
                    </span>
                  )}
                </div>

                {/* Selected title badge */}
                {entry.selected_title && (
                  <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs font-medium text-green-800 dark:text-green-400">Selected Title</span>
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {entry.selected_title}
                    </p>
                  </div>
                )}

                {/* All titles */}
                <div className="space-y-2">
                  {entry.titles.map((titleItem, titleIdx) => {
                    const isString = typeof titleItem === 'string';
                    const title = isString ? titleItem : titleItem.title;
                    const isSelected = !isString && titleItem.selected;

                    return (
                      <div
                        key={titleIdx}
                        className={`p-2 rounded ${
                          isSelected
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900'
                            : 'bg-gray-50 dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {titleIdx + 1}.
                          </span>
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {title}
                            </p>
                          </div>
                          {isSelected && (
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
          ) : (
            <EmptyState stepName="title" />
          )}
        </>
      )}

      {/* Outline */}
      {selectedStep === 'outline' && (
        <>
          {blog?.outlines && blog.outlines.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Outline
            <span className="ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
              {blog.outlines.length} {blog.outlines.length === 1 ? 'entry' : 'entries'}
            </span>
          </h3>
          <div className="space-y-3">
            {blog.outlines.map((entry, idx) => {
              const isOpen = openOutlineIndices.includes(idx);
              return (
                <div key={idx} className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                  {/* Accordion Header - Clickable */}
                  <button
                    onClick={() => toggleOutlineAccordion(idx)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap flex-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        entry.tag === 'final'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : entry.tag === 'updated'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {entry.tag}
                      </span>
                      {(entry.generated_at || entry.updated_at || entry.finalized_at) && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {parseDate(entry.finalized_at || entry.updated_at || entry.generated_at)?.toLocaleString()}
                        </span>
                      )}
                      {entry.primary_keyword && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.primary_keyword}
                        </span>
                      )}
                    </div>
                    {/* Chevron icon */}
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Accordion Content - Collapsible */}
                  {isOpen && (
                    <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                      {/* Additional metadata */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                        {entry.country && (
                          <span className="flex items-center gap-1">
                            Country: <span className="text-sm">{getCountryFlag(entry.country)}</span>
                          </span>
                        )}
                        {entry.category && <span>Category: {entry.category}</span>}
                        {entry.subcategory && <span>Subcategory: {entry.subcategory}</span>}
                        {entry.word_count && <span>Words: {entry.word_count}</span>}
                        {entry.sources_collected && (
                          <span className="text-green-600 dark:text-green-400">✓ Sources Collected</span>
                        )}
                      </div>

                      {/* Title info */}
                      {(entry.selected_title || entry.blog_title) && (
                        <div className="mb-3 text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium">Title:</span> {entry.selected_title || entry.blog_title}
                        </div>
                      )}

                      {/* Secondary keywords */}
                      {entry.secondary_keywords && entry.secondary_keywords.length > 0 && (
                        <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="font-medium">Secondary Keywords:</span> {entry.secondary_keywords.join(', ')}
                        </div>
                      )}

                      {/* Outline sections */}
                      <div className="space-y-3">
                        {entry.outline.outline.sections.map((section, secIdx) => (
                          <div key={secIdx} className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                              {secIdx + 1}. {section.heading}
                            </h4>
                            {section.subsections && section.subsections.length > 0 && (
                              <ul className="space-y-1 ml-4">
                                {section.subsections.map((sub, subIdx) => (
                                  <li key={subIdx} className="text-sm text-gray-600 dark:text-gray-400">
                                    • {sub}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}

                        {/* Conclusion */}
                        {entry.outline.outline.conclusion && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-900">
                            <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                              {entry.outline.outline.conclusion.heading}
                            </h4>
                            {entry.outline.outline.conclusion.subsections && entry.outline.outline.conclusion.subsections.length > 0 && (
                              <ul className="space-y-1 ml-4">
                                {entry.outline.outline.conclusion.subsections.map((sub, subIdx) => (
                                  <li key={subIdx} className="text-sm text-blue-800 dark:text-blue-400">
                                    • {sub}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* FAQs */}
                        {entry.outline.outline.faqs && (
                          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded border border-purple-200 dark:border-purple-900">
                            <h4 className="font-medium text-purple-900 dark:text-purple-300 mb-2">
                              {entry.outline.outline.faqs.heading}
                            </h4>
                            <ul className="space-y-1 ml-4">
                              {entry.outline.outline.faqs.questions.map((question, qIdx) => (
                                <li key={qIdx} className="text-sm text-purple-800 dark:text-purple-400">
                                  {qIdx + 1}. {question}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
          ) : (
            <EmptyState stepName="outline" />
          )}
        </>
      )}

      {/* Sources */}
      {selectedStep === 'sources' && (
        <>
          {blog?.sources && blog.sources.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Sources
            <span className="ml-auto text-xs font-normal text-gray-500 dark:text-gray-400">
              {blog.sources.length} {blog.sources.length === 1 ? 'item' : 'items'}
            </span>
          </h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {blog.sources.map((source, idx) => (
              <div key={idx} className="space-y-3">
                {/* Simple source (old format) */}
                {!source.subsections_data && (
                  <div className="border-l-4 border-orange-300 dark:border-orange-900 pl-4 py-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Source {idx + 1}
                      </span>
                      {source.relevance_score && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                          Score: {source.relevance_score}
                        </span>
                      )}
                    </div>
                    {source.title && (
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                        {source.title}
                      </h4>
                    )}
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all block mb-2"
                      >
                        {source.url}
                      </a>
                    )}
                    {source.content && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-3">
                        {source.content}
                      </p>
                    )}
                  </div>
                )}

                {/* Subsections data (new format with two arrays) */}
                {source.subsections_data && source.subsections_data.map((subsection, subIdx) => (
                  <div key={subIdx} className="border border-orange-200 dark:border-orange-900 rounded-lg overflow-hidden">
                    {/* Subsection Header */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-3 border-b border-orange-200 dark:border-orange-900">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        {subsection.title}
                      </h4>
                      {subsection.heading_title && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Section: {subsection.heading_title}
                        </p>
                      )}
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Sources Array */}
                      {subsection.sources && subsection.sources.length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Source URLs ({subsection.sources.length})
                          </h5>
                          <div className="space-y-2 pl-5">
                            {subsection.sources.map((src, srcIdx) => (
                              <div key={srcIdx} className="flex items-start gap-2">
                                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                                  src.success
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                  {srcIdx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <a
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all block"
                                  >
                                    {src.title || src.url}
                                  </a>
                                  {src.title && (
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                      {src.url}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Informations Object */}
                      {subsection.informations && Object.keys(subsection.informations).length > 0 && (
                        <div>
                          <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Extracted Information ({Object.keys(subsection.informations).length})
                          </h5>
                          <div className="space-y-3 pl-5">
                            {Object.entries(subsection.informations).map(([key, info]) => (
                              <div key={key} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-900">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-600 text-white dark:bg-blue-500">
                                    {key.replace('Source_', 'Source ')}
                                  </span>
                                </div>
                                <a
                                  href={info.link_and_source_name.split(' - ')[0]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline block mb-2 font-medium"
                                >
                                  {info.link_and_source_name.split(' - ')[1] || info.link_and_source_name}
                                </a>
                                <div className="space-y-1.5">
                                  {Object.entries(info.information).map(([infoKey, infoValue]) => (
                                    <div key={infoKey} className="flex items-start gap-2">
                                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-1.5 flex-shrink-0"></span>
                                      <p className="text-xs text-gray-700 dark:text-gray-300 flex-1">
                                        {infoValue}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
          ) : (
            <EmptyState stepName="sources" />
          )}
        </>
      )}

      {/* Featured Image */}
      {selectedStep === 'rayo_featured_image' && (
        <>
          {blog?.rayo_featured_image?.url ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Featured Image
          </h3>
          <img
            src={blog.rayo_featured_image.url}
            alt="Featured"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
          />
          {blog.rayo_featured_image.filename && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {blog.rayo_featured_image.filename}
            </p>
          )}
          {blog.rayo_featured_image.status && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Status: {blog.rayo_featured_image.status}
            </p>
          )}
        </div>
          ) : (
            <EmptyState stepName="featured_image" />
          )}
        </>
      )}

      {/* Content */}
      {selectedStep === 'content' && (
        <>
          {blog?.content ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Content Generated
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Blog content has been generated. View in the editor for full content and editing capabilities.
          </p>
          <button
            onClick={() => router.push(`/blogs/${params.id}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View in Editor
          </button>
        </div>
          ) : (
            <EmptyState stepName="content" />
          )}
        </>
      )}
    </div>
  );
}
